import { Button } from '@/components/ui/button';
import { Save, FileDown, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SensitivityToolbarProps {
  className?: string;
}

export const SensitivityToolbar = ({ className }: SensitivityToolbarProps) => {
  const { toast } = useToast();

  const handleSaveScenario = () => {
    toast({
      title: "Escenario Guardado",
      description: "La configuración actual ha sido guardada exitosamente."
    });
  };

  const handleExportPDF = () => {
    toast({
      title: "Exportando PDF",
      description: "Se está generando el reporte de análisis de sensibilidad..."
    });
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Enlace Copiado",
      description: "El enlace al análisis ha sido copiado al portapapeles."
    });
  };

  return (
    <div className={`fixed top-20 right-6 z-40 bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl shadow-xl p-3 ${className}`}>
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleSaveScenario}
          variant="default"
          size="sm"
          className="gap-2 justify-start"
          aria-label="Guardar escenario actual"
        >
          <Save className="h-4 w-4" />
          <span className="hidden lg:inline">Guardar</span>
        </Button>
        
        <Button
          onClick={handleExportPDF}
          variant="outline"
          size="sm"
          className="gap-2 justify-start"
          aria-label="Exportar análisis en PDF"
        >
          <FileDown className="h-4 w-4" />
          <span className="hidden lg:inline">PDF</span>
        </Button>
        
        <Button
          onClick={handleShareLink}
          variant="outline"
          size="sm"
          className="gap-2 justify-start"
          aria-label="Compartir enlace del análisis"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden lg:inline">Compartir</span>
        </Button>
      </div>
    </div>
  );
};