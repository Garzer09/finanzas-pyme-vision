import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Image } from 'lucide-react';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { CompanyLogo } from '@/components/CompanyLogo';
import { cn } from '@/lib/utils';

export const CompanyLogoUpload = () => {
  const { logoUrl, uploading, uploadLogo, removeLogo } = useCompanyLogo();
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    await uploadLogo(file);
    setPreview(null);
  };

  const handleRemoveLogo = async () => {
    await removeLogo();
    setPreview(null);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Logo de la Empresa</h3>
          {logoUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveLogo}
              disabled={uploading}
            >
              <X className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>

        {/* Current Logo Display */}
        {logoUrl && !preview && (
          <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <CompanyLogo logoUrl={logoUrl} size="lg" />
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg border-2 border-dashed border-steel-300">
            <img
              src={preview}
              alt="Vista previa"
              className="h-12 w-auto max-w-48 object-contain"
            />
          </div>
        )}

        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive 
              ? "border-steel-400 bg-steel-50" 
              : "border-slate-300 hover:border-steel-400 hover:bg-slate-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-steel-100 rounded-lg flex items-center justify-center">
              <Image className="h-6 w-6 text-steel-600" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-slate-900 mb-2">
                {logoUrl ? 'Actualizar logo' : 'Subir logo de la empresa'}
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Arrastra y suelta tu imagen aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-slate-500">
                PNG, JPG o SVG hasta 2MB
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={openFileDialog}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};