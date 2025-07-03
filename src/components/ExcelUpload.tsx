
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExcelUploadProps {
  onUploadComplete?: (fileId: string, processedData: any) => void;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    const validFormats = ['.xlsx', '.xls', '.pdf'];
    const isValidFormat = validFormats.some(format => file.name.toLowerCase().endsWith(format));
    
    if (!isValidFormat) {
      toast({
        title: "Formato no válido",
        description: "Por favor, sube un archivo Excel (.xlsx, .xls) o PDF",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(`https://hlwchpmogvwmpuvwmvwv.supabase.co/functions/v1/process-excel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Archivo procesado exitosamente",
          description: "Claude ha analizado los datos financieros y están listos para el análisis",
        });
        
        if (onUploadComplete) {
          onUploadComplete(result.file_id, result.processed_data);
        }
      } else {
        throw new Error(result.error || 'Error procesando el archivo');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error al procesar archivo",
        description: error.message || "Hubo un problema procesando tu archivo Excel",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <Card className="dashboard-card bg-white p-8">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          dragOver
            ? 'border-steel-blue bg-steel-blue-light'
            : 'border-light-gray-300 hover:border-steel-blue hover:bg-steel-blue-light'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <>
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 text-steel-blue animate-spin" />
                <Brain className="h-8 w-8 text-steel-blue animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-steel-blue-dark">Procesando con IA...</h3>
              <p className="text-steel-blue">Claude está analizando los datos financieros del archivo</p>
              <div className="mt-2 text-sm text-steel-blue bg-steel-blue-light px-3 py-1 rounded-full">
                Extrayendo: P&G, Balance, Flujos, Ratios, Pool Financiero, Validando Datos
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <FileSpreadsheet className="h-12 w-12 text-steel-blue" />
                <Brain className="h-8 w-8 text-steel-blue" />
              </div>
              <h3 className="text-lg font-semibold text-steel-blue-dark">Sube tu archivo financiero</h3>
              <p className="text-professional max-w-md">
                Arrastra y suelta tu archivo Excel o PDF con datos financieros, auditoría, pool financiero y ratios. 
                Claude analizará automáticamente la información usando IA avanzada.
              </p>
              
              <div className="flex gap-4">
                <Button
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="btn-steel-primary"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar archivo
                </Button>
              </div>
              
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 alert-info rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-steel-blue mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-steel-blue-dark font-medium mb-1">Datos que analiza Claude</h4>
            <ul className="text-steel-blue text-sm space-y-1">
              <li>• Estados Financieros: P&G, Balance, Flujos de Efectivo</li>
              <li>• Auditoría: Modelos 200 IS, 303, 347, CIRBE, AET+SS</li>
              <li>• Pool Financiero: Estructura de deuda, amortización, tipos de interés</li>
              <li>• Ratios: Liquidez, solvencia, rentabilidad, endeudamiento</li>
              <li>• Proyecciones: Flujos futuros, escenarios, análisis de sensibilidad</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};
