
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Formato no válido",
        description: "Por favor, sube un archivo Excel (.xlsx o .xls)",
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

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-excel`, {
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
          description: "Los datos financieros han sido extraídos y están listos para el análisis",
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
    <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-8">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          dragOver
            ? 'border-teal-400 bg-teal-500/10'
            : 'border-gray-500 hover:border-teal-500 hover:bg-teal-500/5'
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
              <Loader2 className="h-12 w-12 text-teal-400 animate-spin" />
              <h3 className="text-lg font-semibold text-white">Procesando archivo...</h3>
              <p className="text-gray-300">La IA está extrayendo los datos financieros</p>
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-12 w-12 text-teal-400" />
              <h3 className="text-lg font-semibold text-white">Sube tu archivo Excel financiero</h3>
              <p className="text-gray-300 max-w-md">
                Arrastra y suelta tu archivo Excel con los datos de P&G, Balance y Flujo de Caja, 
                o haz clic para seleccionarlo
              </p>
              
              <div className="flex gap-4">
                <Button
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar archivo
                </Button>
              </div>
              
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-blue-300 font-medium mb-1">Formato requerido</h4>
            <p className="text-blue-200 text-sm">
              Tu archivo Excel debe contener hojas separadas para: Cuenta de Pérdidas y Ganancias, 
              Balance de Situación, y Estado de Flujos de Efectivo. La IA extraerá automáticamente 
              los datos de estas hojas.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
