import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Calendar, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminTopNavigation } from '@/components/AdminTopNavigation';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessingJob {
  id: string;
  company_id: string;
  period_type: string;
  period_year: number;
  period_quarter?: number;
  period_month?: number;
  import_mode: string;
  dry_run: boolean;
  status: string;
  stats_json: any;
  created_at: string;
  updated_at: string;
  file_path: string;
  error_log_path?: string;
}

interface Company {
  id: string;
  name: string;
}

export const AdminCargasPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const companyId = searchParams.get('companyId');
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);

  useEffect(() => {
    if (companyId) {
      loadCompanyAndJobs();
      setupRealtime();
    }

    return () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
    };
  }, [companyId, statusFilter]);

  const loadCompanyAndJobs = async () => {
    if (!companyId) return;

    try {
      // Load company info
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Load processing jobs
      let query = supabase
        .from('processing_jobs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: jobsData, error: jobsError } = await query;
      if (jobsError) throw jobsError;

      setJobs(jobsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    if (!companyId) return;

    const subscription = supabase
      .channel('processing_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_jobs',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          console.log('Processing job changed:', payload);
          loadCompanyAndJobs();
        }
      )
      .subscribe();

    setRealtimeSubscription(subscription);
  };

  const handleRetryJob = async (job: ProcessingJob) => {
    try {
      // Create a new job with the same parameters
      const { error } = await supabase.functions.invoke('admin-pack-upload', {
        body: {
          company_id: job.company_id,
          period_type: job.period_type,
          period_year: job.period_year,
          period_quarter: job.period_quarter,
          period_month: job.period_month,
          import_mode: job.import_mode,
          dry_run: job.dry_run,
        }
      });

      if (error) throw error;

      toast({
        title: "Reintento iniciado",
        description: "Se ha iniciado un nuevo procesamiento con los mismos parámetros"
      });
    } catch (error) {
      console.error('Error retrying job:', error);
      toast({
        title: "Error",
        description: "No se pudo reintentar el procesamiento",
        variant: "destructive"
      });
    }
  };

  const handleDownloadArtifacts = async (job: ProcessingJob) => {
    try {
      // Get signed URLs for artifacts
      const { data: signedUrls, error } = await supabase.functions.invoke('get-signed-artifact', {
        body: { jobId: job.id }
      });

      if (error) throw error;

      // Download each artifact
      for (const [name, url] of Object.entries(signedUrls)) {
        const link = document.createElement('a');
        link.href = url as string;
        link.download = `${job.id}_${name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Descarga iniciada",
        description: "Los artefactos se están descargando"
      });
    } catch (error) {
      console.error('Error downloading artifacts:', error);
      toast({
        title: "Error",
        description: "No se pudieron descargar los artefactos",
        variant: "destructive"
      });
    }
  };

  const formatPeriod = (job: ProcessingJob) => {
    const { period_type, period_year, period_quarter, period_month } = job;
    
    if (period_type === 'annual') {
      return `${period_year}`;
    } else if (period_type === 'quarterly') {
      return `T${period_quarter}/${period_year}`;
    } else if (period_type === 'monthly') {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${monthNames[period_month! - 1]}/${period_year}`;
    }
    return `${period_year}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'PARSING':
      case 'VALIDATING':
      case 'LOADING':
      case 'AGGREGATING':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'PARSING':
      case 'VALIDATING':
      case 'LOADING':
      case 'AGGREGATING': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!companyId) {
    return (
      <RoleBasedAccess allowedRoles={['admin']}>
        <div className="min-h-screen bg-background">
          <AdminTopNavigation />
          <main className="p-6">
            <div className="max-w-4xl mx-auto text-center py-12">
              <h1 className="text-2xl font-bold text-foreground">ID de empresa no especificado</h1>
              <p className="text-muted-foreground mt-2">
                Selecciona una empresa desde la página de empresas
              </p>
              <Button onClick={() => navigate('/admin/empresas')} className="mt-4">
                Volver a Empresas
              </Button>
            </div>
          </main>
        </div>
      </RoleBasedAccess>
    );
  }

  if (loading) {
    return (
      <RoleBasedAccess allowedRoles={['admin']}>
        <div className="min-h-screen bg-background">
          <AdminTopNavigation />
          <main className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Cargando histórico...</p>
              </div>
            </div>
          </main>
        </div>
      </RoleBasedAccess>
    );
  }

  return (
    <RoleBasedAccess allowedRoles={['admin']}>
      <div className="min-h-screen bg-background">
        <AdminTopNavigation />
        <main className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/admin/empresas')}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      Histórico de Cargas
                    </h1>
                    <p className="text-muted-foreground">
                      {company?.name || 'Empresa no encontrada'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="DONE">Completados</SelectItem>
                      <SelectItem value="FAILED">Fallidos</SelectItem>
                      <SelectItem value="PARSING">En progreso</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline"
                    onClick={loadCompanyAndJobs}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Actualizar
                  </Button>
                </div>
              </div>

              {/* Jobs Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Trabajos de Procesamiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {jobs.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                      <h3 className="text-lg font-semibold mt-4">No hay trabajos de procesamiento</h3>
                      <p className="text-muted-foreground">
                        {statusFilter === 'all' 
                          ? 'Esta empresa no tiene trabajos registrados'
                          : `No hay trabajos con estado "${statusFilter}"`
                        }
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estado</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Modo</TableHead>
                          <TableHead>Progreso</TableHead>
                          <TableHead>Inicio</TableHead>
                          <TableHead>Duración</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobs.map((job) => {
                          const stats = job.stats_json || {};
                          const duration = job.updated_at 
                            ? Math.round((new Date(job.updated_at).getTime() - new Date(job.created_at).getTime()) / 1000)
                            : null;

                          return (
                            <TableRow key={job.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(job.status)}
                                  <Badge className={getStatusColor(job.status)}>
                                    {job.status}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatPeriod(job)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {job.period_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {job.import_mode}
                                  </Badge>
                                  {job.dry_run && (
                                    <Badge variant="outline" className="text-xs">
                                      DRY-RUN
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {stats.progress_pct !== undefined ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${stats.progress_pct}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {stats.progress_pct}%
                                    </span>
                                  </div>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(job.created_at).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {duration ? `${duration}s` : '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {(job.status === 'DONE' || job.status === 'FAILED') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownloadArtifacts(job)}
                                      className="gap-1"
                                    >
                                      <Download className="h-3 w-3" />
                                      Logs
                                    </Button>
                                  )}
                                  {job.status === 'FAILED' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRetryJob(job)}
                                      className="gap-1"
                                    >
                                      <RefreshCw className="h-3 w-3" />
                                      Reintentar
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
          </div>
        </main>
      </div>
    </RoleBasedAccess>
  );
};

export default AdminCargasPage;