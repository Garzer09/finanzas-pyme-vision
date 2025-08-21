import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { validateTemplates, logTemplateValidation, type TemplateValidation } from '@/utils/templateValidator';

export const TemplateValidator: React.FC = () => {
  const [validations, setValidations] = useState<TemplateValidation[]>([]);
  const [loading, setLoading] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    try {
      const results = await validateTemplates();
      setValidations(results);
      logTemplateValidation(results);
    } catch (error) {
      console.error('Error validating templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runValidation();
  }, []);

  const getStatusIcon = (validation: TemplateValidation) => {
    if (!validation.available) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (!validation.hasCorrectSections) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getStatusColor = (validation: TemplateValidation) => {
    if (!validation.available) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (!validation.hasCorrectSections) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const downloadTemplate = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/templates/${filename}`;
    link.download = filename;
    link.click();
  };

  const availableCount = validations.filter(v => v.available).length;
  const correctCount = validations.filter(v => v.hasCorrectSections).length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📋 Validación de Plantillas CSV
            <Badge variant="outline" className="ml-2">
              {availableCount}/{validations.length} disponibles
            </Badge>
            <Badge variant="outline" className="ml-2">
              {correctCount}/{validations.length} corregidas
            </Badge>
          </CardTitle>
          <Button 
            onClick={runValidation} 
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Validando...' : 'Revalidar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && validations.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Validando plantillas...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {validations.map((validation, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(validation)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(validation)}
                    <div>
                      <h4 className="font-medium text-sm">{validation.filename}</h4>
                      {validation.error && (
                        <p className="text-xs mt-1 opacity-75">{validation.error}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {validation.available && (
                      <Badge 
                        variant={validation.hasCorrectSections ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {validation.hasCorrectSections ? 'Corregida' : 'Sin secciones'}
                      </Badge>
                    )}
                    
                    {validation.available && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadTemplate(validation.filename)}
                        className="h-8 px-2"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Descargar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {validations.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Estado de las Plantillas</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>✅ <strong>Corregidas:</strong> Incluyen secciones/categorías para clasificación automática</p>
              <p>⚠️ <strong>Sin secciones:</strong> Funcionan pero sin clasificación automática de ratios</p>
              <p>❌ <strong>No disponibles:</strong> No se pueden descargar</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
