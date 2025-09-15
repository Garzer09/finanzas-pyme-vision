import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Download, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadJobStatusProps {
  jobId: string;
  onComplete?: () => void;
}

interface JobStatus {
  id: string;
  status: string;
  file_type: string;
  rows_total?: number;
  rows_ok?: number;
  rows_error?: number;
  error_message?: string;
  validate_only?: boolean;
  created_at: string;
  updated_at: string;
}

interface JobLog {
  id: number;
  phase?: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  duration_ms?: number;
  meta?: any;
  created_at: string;
}

export function UploadJobStatus({ jobId, onComplete }: UploadJobStatusProps) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);

  const statusConfig = {
    queued: { label: 'En Cola', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    validating: { label: 'Validando', color: 'bg-blue-100 text-blue-800', icon: Loader2 },
    inserting: { label: 'Insertando', color: 'bg-blue-100 text-blue-800', icon: Loader2 },
    transforming: { label: 'Transformando', color: 'bg-blue-100 text-blue-800', icon: Loader2 },
    refreshed: { label: 'Refrescando', color: 'bg-blue-100 text-blue-800', icon: Loader2 },
    completed: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    failed: { label: 'Fallido', color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  const loadJobData = async () => {
    try {
      // Load job status
      const { data: jobData, error: jobError } = await supabase
        .from('upload_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Load logs
      const { data: logsData, error: logsError } = await supabase
        .from('upload_job_logs')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (logsError) throw logsError;
      setLogs(logsData || []);

    } catch (error) {
      console.error('Error loading job data:', error);
      toast.error('Error al cargar el estado del trabajo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobData();

    // Set up realtime subscription
    const channel = supabase
      .channel(`upload-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'upload_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          if (payload.new) {
            setJob(payload.new as JobStatus);
            
            // Call onComplete when job finishes
            if ((payload.new as JobStatus).status === 'completed' && onComplete) {
              setTimeout(onComplete, 2000); // Delay to show completion
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'upload_job_logs',
          filter: `job_id=eq.${jobId}`
        },
        (payload) => {
          if (payload.new) {
            setLogs(prev => [...prev, payload.new as JobLog]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, onComplete]);

  const calculateProgress = () => {
    if (!job) return 0;
    
    const statusProgress = {
      queued: 10,
      validating: 25,
      inserting: 50,
      transforming: 75,
      refreshed: 90,
      completed: 100,
      failed: 100
    };

    return statusProgress[job.status as keyof typeof statusProgress] || 0;
  };

  const downloadErrors = async () => {
    try {
      const { data: errors, error } = await supabase
        .from('staging_errors')
        .select('*')
        .eq('job_id', jobId)
        .order('row_number');

      if (error) throw error;

      if (!errors || errors.length === 0) {
        toast.info('No hay errores para descargar');
        return;
      }

      // Generate CSV content
      const headers = ['Fila', 'Columna', 'Código Error', 'Detalle', 'Datos Originales'];
      const csvContent = [
        headers.join(','),
        ...errors.map(err => [
          err.row_number,
          err.column_name || '',
          err.error_code || '',
          `"${String(err.error_detail || '').replace(/"/g, '""')}"`,
          `"${String(err.raw_record || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `errores-${jobId}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Archivo de errores descargado');

    } catch (error) {
      toast.error('Error al descargar errores: ' + String(error));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Cargando estado del trabajo...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            No se pudo cargar la información del trabajo
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = statusConfig[job.status as keyof typeof statusConfig];
  const StatusIcon = statusInfo?.icon || Clock;
  const isActive = ['queued', 'validating', 'inserting', 'transforming', 'refreshed'].includes(job.status);

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${isActive ? 'animate-spin' : ''}`} />
            Estado del Procesamiento
          </CardTitle>
          <CardDescription>
            {job.validate_only ? 'Validación' : 'Procesamiento'} de archivo {
              job.file_type === 'pyg' ? 'P&G' :
              job.file_type === 'balance' ? 'Balance' :
              'Flujo de Efectivo'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status and Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className={statusInfo?.color}>
                {statusInfo?.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {calculateProgress()}%
              </span>
            </div>
            <Progress value={calculateProgress()} />
          </div>

          {/* Statistics */}
          {(job.rows_total || job.rows_ok || job.rows_error) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold">{(job.rows_total || 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold text-green-600">{(job.rows_ok || 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Procesadas</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold text-destructive">{(job.rows_error || 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Errores</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {job.status === 'failed' && job.error_message && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{job.error_message}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {job.rows_error && job.rows_error > 0 && (
              <Button variant="outline" onClick={downloadErrors}>
                <Download className="w-4 h-4 mr-2" />
                Descargar Errores
              </Button>
            )}
            <Button variant="outline" onClick={loadJobData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registro de Procesamiento</CardTitle>
            <CardDescription>
              Historial detallado del procesamiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={log.id || index} className="flex items-start gap-3 text-sm">
                    <div className="w-20 text-xs text-muted-foreground shrink-0">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                    <Badge 
                      variant={log.level === 'error' ? 'destructive' : 
                               log.level === 'warn' ? 'secondary' : 'default'}
                      className="shrink-0"
                    >
                      {log.level}
                    </Badge>
                    <div className="flex-1">
                      <div>{log.message}</div>
                      {log.phase && (
                        <div className="text-xs text-muted-foreground">
                          Fase: {log.phase}
                        </div>
                      )}
                    </div>
                    {log.duration_ms && (
                      <div className="text-xs text-muted-foreground shrink-0">
                        {log.duration_ms}ms
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {job.status === 'completed' && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            {job.validate_only 
              ? 'Validación completada. Los datos están listos para ser procesados.'
              : 'Procesamiento completado exitosamente. Los datos ya están disponibles en los dashboards.'
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}