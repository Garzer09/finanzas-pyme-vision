import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProcessingJob {
  id: string;
  status: string;
  file_path: string;
  created_at: string;
  updated_at: string;
  error_log_path?: string;
  stats_json?: any;
  period_year?: number;
  period_type?: string;
}

interface ProcessingStatusPanelProps {
  companyId?: string;
}

export const ProcessingStatusPanel: React.FC<ProcessingStatusPanelProps> = ({
  companyId
}) => {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ProcessingJob | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    loadProcessingJobs();
  }, [companyId]);

  const loadProcessingJobs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('processing_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error loading processing jobs:', error);
      toast({
        title: "Error cargando trabajos de procesamiento",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'default';
      case 'failed':
      case 'error':
        return 'destructive';
      case 'pending':
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getJobSummary = (job: ProcessingJob) => {
    if (job.stats_json) {
      const stats = job.stats_json;
      const parts = [];
      
      if (stats.inserted_lines) parts.push(`${stats.inserted_lines} líneas`);
      if (stats.processed_files) parts.push(`${stats.processed_files} archivos`);
      if (stats.errors_count) parts.push(`${stats.errors_count} errores`);
      
      return parts.join(', ') || 'Sin estadísticas';
    }
    return 'Procesando...';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Estado de Procesamiento
              </CardTitle>
              <CardDescription>
                Monitoreo de trabajos de carga y procesamiento de datos
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadProcessingJobs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 animate-spin" />
              Cargando trabajos de procesamiento...
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="font-medium">{formatFileName(job.file_path)}</div>
                        <div className="text-sm text-muted-foreground">
                          {getJobSummary(job)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(job.status)}>
                        {job.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(job.updated_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No se encontraron trabajos de procesamiento.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Job Details */}
      {selectedJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalles del Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Archivo</label>
                <p className="text-sm text-muted-foreground">{formatFileName(selectedJob.file_path)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedJob.status)}
                  <Badge variant={getStatusVariant(selectedJob.status)}>
                    {selectedJob.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Creado</label>
                <p className="text-sm text-muted-foreground">{formatDate(selectedJob.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Última actualización</label>
                <p className="text-sm text-muted-foreground">{formatDate(selectedJob.updated_at)}</p>
              </div>
              {selectedJob.period_year && (
                <div>
                  <label className="text-sm font-medium">Período</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedJob.period_year} ({selectedJob.period_type || 'annual'})
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Statistics */}
            {selectedJob.stats_json && (
              <div>
                <h4 className="text-sm font-medium mb-2">Estadísticas</h4>
                <ScrollArea className="h-32 w-full border rounded p-3">
                  <pre className="text-xs">
                    {JSON.stringify(selectedJob.stats_json, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}

            {/* Error Log */}
            {selectedJob.error_log_path && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <p className="font-medium">Error durante el procesamiento</p>
                    <p className="text-sm mt-1">Log de errores: {selectedJob.error_log_path}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedJob(null)}
              >
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};