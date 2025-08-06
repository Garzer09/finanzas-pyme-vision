import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, XCircle, Info, Edit2, Save, X } from 'lucide-react';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  row?: number;
  column?: string;
  suggestion?: string;
  fixable: boolean;
}

interface PreProcessingData {
  headers: string[];
  rows: any[];
  template_type: string;
  validation_issues: ValidationIssue[];
  file_info: {
    name: string;
    size: number;
    rows_count: number;
  };
}

interface EditableCell {
  row: number;
  column: string;
  original_value: any;
  new_value: any;
  is_editing: boolean;
}

interface PreProcessingPreviewProps {
  files: File[];
  onValidationComplete: (results: { [filename: string]: PreProcessingData }) => void;
  onCancel: () => void;
}

export const PreProcessingPreview: React.FC<PreProcessingPreviewProps> = ({
  files,
  onValidationComplete,
  onCancel
}) => {
  const [previewData, setPreviewData] = useState<{ [filename: string]: PreProcessingData }>({});
  const [loading, setLoading] = useState(false);
  const [editableCells, setEditableCells] = useState<{ [key: string]: EditableCell }>({});
  const [currentFile, setCurrentFile] = useState<string>('');

  useEffect(() => {
    if (files.length > 0) {
      processFiles();
    }
  }, [files]);

  const processFiles = async () => {
    setLoading(true);
    const results: { [filename: string]: PreProcessingData } = {};

    try {
      for (const file of files) {
        console.log(`🔍 Pre-processing file: ${file.name}`);
        
        const sessionId = crypto.randomUUID();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('dry_run', 'true');
        formData.append('session_id', sessionId);

        const { data, error } = await supabase.functions.invoke('unified-template-processor-v3', {
          body: formData
        });

        if (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast({
            title: "Pre-processing Error",
            description: `Failed to pre-process ${file.name}: ${error.message}`,
            variant: "destructive",
          });
          continue;
        }

        if (data?.success) {
          // Transform the response into PreProcessingData format
          const fileContent = await file.text();
          const lines = fileContent.split('\n').filter(line => line.trim());
          const headers = lines[0]?.split(',').map(h => h.trim().replace(/['"]/g, '')) || [];
          
          const validationIssues: ValidationIssue[] = [
            ...data.errors.map((error: string) => ({
              type: 'error' as const,
              message: error,
              fixable: isFixableError(error)
            })),
            ...data.warnings.map((warning: string) => ({
              type: 'warning' as const,
              message: warning,
              fixable: isFixableWarning(warning)
            }))
          ];

          results[file.name] = {
            headers,
            rows: data.preview || [],
            template_type: data.template_type,
            validation_issues: validationIssues,
            file_info: {
              name: file.name,
              size: file.size,
              rows_count: data.rows_processed
            }
          };
        }
      }

      setPreviewData(results);
      if (Object.keys(results).length > 0) {
        setCurrentFile(Object.keys(results)[0]);
      }

    } catch (error) {
      console.error('Pre-processing error:', error);
      toast({
        title: "Pre-processing Failed",
        description: "Failed to pre-process files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const getIssueIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info':
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  const startCellEdit = (filename: string, row: number, column: string, value: any) => {
    const key = `${filename}-${row}-${column}`;
    setEditableCells(prev => ({
      ...prev,
      [key]: {
        row,
        column,
        original_value: value,
        new_value: value,
        is_editing: true
      }
    }));
  };

  const saveCellEdit = (filename: string, row: number, column: string) => {
    const key = `${filename}-${row}-${column}`;
    const editCell = editableCells[key];
    
    if (editCell) {
      // Update the preview data
      setPreviewData(prev => ({
        ...prev,
        [filename]: {
          ...prev[filename],
          rows: prev[filename].rows.map((r, idx) => 
            idx === row ? { ...r, [column]: editCell.new_value } : r
          )
        }
      }));

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

  const cancelCellEdit = (filename: string, row: number, column: string) => {
    const key = `${filename}-${row}-${column}`;
    setEditableCells(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  };

  const updateCellValue = (filename: string, row: number, column: string, value: any) => {
    const key = `${filename}-${row}-${column}`;
    setEditableCells(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        new_value: value
      }
    }));
  };

  const hasErrors = Object.values(previewData).some(data => 
    data.validation_issues.some(issue => issue.type === 'error')
  );

  const hasFixableIssues = Object.values(previewData).some(data =>
    data.validation_issues.some(issue => issue.fixable)
  );

  const currentFileData = previewData[currentFile];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Pre-processing files...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">File Pre-processing Preview</h2>
          <p className="text-muted-foreground">
            Review and fix validation issues before final processing
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={() => onValidationComplete(previewData)}
            disabled={hasErrors && !hasFixableIssues}
          >
            Continue Processing
          </Button>
        </div>
      </div>

      {hasErrors && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Some files have validation errors that need to be fixed before processing.
            {hasFixableIssues && " You can edit the data below to resolve some issues."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={currentFile} onValueChange={setCurrentFile} className="w-full">
        <TabsList className="grid w-full grid-cols-auto">
          {Object.keys(previewData).map((filename) => {
            const fileData = previewData[filename];
            const errorCount = fileData.validation_issues.filter(i => i.type === 'error').length;
            const warningCount = fileData.validation_issues.filter(i => i.type === 'warning').length;
            
            return (
              <TabsTrigger key={filename} value={filename} className="relative">
                {filename}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {errorCount}
                  </Badge>
                )}
                {warningCount > 0 && errorCount === 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {warningCount}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(previewData).map(([filename, data]) => (
          <TabsContent key={filename} value={filename} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">File Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div>Size: {(data.file_info.size / 1024).toFixed(1)} KB</div>
                  <div>Rows: {data.file_info.rows_count}</div>
                  <div>Type: {data.template_type}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Validation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span>{data.validation_issues.filter(i => i.type === 'error').length} Errors</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span>{data.validation_issues.filter(i => i.type === 'warning').length} Warnings</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {data.validation_issues.filter(i => i.type === 'error').length === 0 ? (
                    <div className="flex items-center space-x-2 text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span>Ready to Process</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-destructive">
                      <XCircle className="h-4 w-4" />
                      <span>Needs Attention</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {data.validation_issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Validation Issues</CardTitle>
                  <CardDescription>
                    Review and fix the following issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {data.validation_issues.map((issue, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 border rounded">
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
                            <Badge variant="outline" className="text-xs">
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Preview</CardTitle>
                <CardDescription>
                  Preview of the first 10 rows. Click cells to edit if needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {data.headers.map((header) => (
                          <TableHead key={header} className="min-w-[120px]">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.rows.slice(0, 10).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {data.headers.map((header) => {
                            const cellKey = `${filename}-${rowIndex}-${header}`;
                            const editableCell = editableCells[cellKey];
                            const cellValue = row[header];

                            return (
                              <TableCell key={header} className="relative">
                                {editableCell?.is_editing ? (
                                  <div className="flex items-center space-x-1">
                                    <Input
                                      value={editableCell.new_value}
                                      onChange={(e) => updateCellValue(filename, rowIndex, header, e.target.value)}
                                      className="h-8 text-xs"
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => saveCellEdit(filename, rowIndex, header)}
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => cancelCellEdit(filename, rowIndex, header)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div
                                    className="cursor-pointer hover:bg-muted p-1 rounded flex items-center space-x-1"
                                    onClick={() => startCellEdit(filename, rowIndex, header, cellValue)}
                                  >
                                    <span className="text-sm">{cellValue}</span>
                                    <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};