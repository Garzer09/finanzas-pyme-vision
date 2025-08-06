import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

interface ProcessingLog {
  id: string;
  session_id: string;
  company_id: string;
  user_id: string;
  step_name: string;
  step_status: string;
  step_data: any;
  error_details: any;
  performance_metrics: any;
  timestamp: string;
  created_at: string;
}

interface ProcessingSession {
  session_id: string;
  logs: ProcessingLog[];
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  total_duration?: number;
}

export const ProcessingMonitorDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<ProcessingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    fetchProcessingLogs();
    const interval = setInterval(fetchProcessingLogs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchProcessingLogs = async () => {
    try {
      setLoading(true);
      
      const { data: logs, error } = await supabase
        .from('processing_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Group logs by session
      const sessionMap = new Map<string, ProcessingLog[]>();
      
      logs?.forEach(log => {
        if (!sessionMap.has(log.session_id)) {
          sessionMap.set(log.session_id, []);
        }
        sessionMap.get(log.session_id)!.push(log);
      });

      // Convert to session objects
      const processingSessions: ProcessingSession[] = Array.from(sessionMap.entries()).map(([sessionId, sessionLogs]) => {
        const sortedLogs = sessionLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const firstLog = sortedLogs[0];
        const lastLog = sortedLogs[sortedLogs.length - 1];
        
        let status: 'running' | 'completed' | 'failed' = 'running';
        if (lastLog.step_status === 'failed') {
          status = 'failed';
        } else if (lastLog.step_name === 'processing_complete') {
          status = 'completed';
        }

        const startTime = new Date(firstLog.timestamp).getTime();
        const endTime = new Date(lastLog.timestamp).getTime();

        return {
          session_id: sessionId,
          logs: sortedLogs,
          status,
          started_at: firstLog.timestamp,
          completed_at: status !== 'running' ? lastLog.timestamp : undefined,
          total_duration: status !== 'running' ? endTime - startTime : undefined
        };
      });

      setSessions(processingSessions);
    } catch (error) {
      console.error('Error fetching processing logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch processing logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'started':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: 'running' | 'completed' | 'failed') => {
    const variants = {
      running: 'secondary',
      completed: 'default',
      failed: 'destructive'
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const selectedSessionData = sessions.find(s => s.session_id === selectedSession);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Processing Monitor</h2>
          <p className="text-muted-foreground">Real-time monitoring of file processing sessions</p>
        </div>
        <Button onClick={fetchProcessingLogs} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="details">Session Details</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card 
                key={session.session_id} 
                className={`cursor-pointer transition-colors ${
                  selectedSession === session.session_id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedSession(session.session_id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Session {session.session_id.slice(0, 8)}...
                    </CardTitle>
                    {getStatusBadge(session.status)}
                  </div>
                  <CardDescription>
                    Started: {new Date(session.started_at).toLocaleString()}
                    {session.completed_at && (
                      <> • Duration: {formatDuration(session.total_duration!)}</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {session.logs.length} steps completed
                    </span>
                    <div className="flex space-x-1">
                      {session.logs.slice(-5).map((log, index) => (
                        <div key={index} className="flex items-center">
                          {getStatusIcon(log.step_status)}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedSessionData ? (
            <Card>
              <CardHeader>
                <CardTitle>Session Details: {selectedSessionData.session_id}</CardTitle>
                <CardDescription>
                  Detailed step-by-step processing log
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] w-full">
                  <div className="space-y-3">
                    {selectedSessionData.logs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(log.step_status)}
                            <span className="font-medium">{log.step_name}</span>
                            <Badge variant="outline">{log.step_status}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {Object.keys(log.step_data).length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Step Data:</p>
                            <pre className="text-xs bg-muted p-2 rounded text-wrap">
                              {JSON.stringify(log.step_data, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {Object.keys(log.error_details).length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-destructive mb-1">Error Details:</p>
                            <pre className="text-xs bg-destructive/10 p-2 rounded text-wrap">
                              {JSON.stringify(log.error_details, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {Object.keys(log.performance_metrics).length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Performance:</p>
                            <div className="text-xs bg-muted p-2 rounded">
                              {Object.entries(log.performance_metrics).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span>{key}:</span>
                                  <span>{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Select a session to view details</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};