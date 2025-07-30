import React, { useState } from 'react';
import { useDebugTools } from '@/hooks/useDebugTools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bug, 
  Activity, 
  AlertTriangle, 
  Info, 
  Download, 
  Trash2, 
  Power, 
  PowerOff,
  Clock,
  Server,
  Zap,
  TrendingUp,
  Users,
  Eye,
  BarChart3
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DebugDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebugDashboard: React.FC<DebugDashboardProps> = ({ isOpen, onClose }) => {
  const {
    healthStatus,
    logs,
    metrics,
    isDebugEnabled,
    exportLogs,
    clearLogs,
    enableDebugMode,
    disableDebugMode,
    getFilteredLogs,
    getFilteredMetrics
  } = useDebugTools();

  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('all');
  const [selectedMetricType, setSelectedMetricType] = useState<string>('all');

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bug className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredLogs = selectedLogLevel === 'all' 
    ? logs.slice(0, 100)
    : getFilteredLogs(selectedLogLevel, 100);

  const filteredMetrics = selectedMetricType === 'all'
    ? metrics.slice(0, 100)
    : getFilteredMetrics(selectedMetricType, 100);

  const getAverageMetric = (pattern: string) => {
    const relevantMetrics = metrics.filter(m => m.name.includes(pattern));
    if (relevantMetrics.length === 0) return 0;
    return relevantMetrics.reduce((sum, m) => sum + m.value, 0) / relevantMetrics.length;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Debug Dashboard
              </CardTitle>
              <CardDescription>
                Monitor application health, logs, and performance metrics
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={isDebugEnabled ? disableDebugMode : enableDebugMode}
                variant={isDebugEnabled ? "destructive" : "default"}
                size="sm"
              >
                {isDebugEnabled ? <PowerOff className="h-4 w-4 mr-2" /> : <Power className="h-4 w-4 mr-2" />}
                Debug {isDebugEnabled ? 'ON' : 'OFF'}
              </Button>
              <Button onClick={onClose} variant="outline" size="sm">
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Health Status Overview */}
          {healthStatus && (
            <div className="px-6 py-4 border-b bg-muted/50">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(healthStatus.status)}`}>
                    {healthStatus.status.toUpperCase()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Status</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{healthStatus.recentErrors}</div>
                  <p className="text-xs text-muted-foreground">Errors (5m)</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{healthStatus.recentWarnings}</div>
                  <p className="text-xs text-muted-foreground">Warnings (5m)</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{healthStatus.avgLoadTime.toFixed(0)}ms</div>
                  <p className="text-xs text-muted-foreground">Avg Load</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{healthStatus.logsCount}</div>
                  <p className="text-xs text-muted-foreground">Total Logs</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {healthStatus.memoryUsage 
                      ? `${(healthStatus.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(0)}MB`
                      : 'N/A'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Memory</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Tabs */}
          <div className="flex-1 px-6">
            <Tabs defaultValue="logs" className="h-full flex flex-col">
              <div className="flex items-center justify-between py-4">
                <TabsList>
                  <TabsTrigger value="logs" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Logs
                  </TabsTrigger>
                  <TabsTrigger value="metrics" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Metrics
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Performance
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button onClick={exportLogs} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={clearLogs} variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>

              <TabsContent value="logs" className="flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <Select value={selectedLogLevel} onValueChange={setSelectedLogLevel}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="error">Errors</SelectItem>
                      <SelectItem value="warn">Warnings</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="secondary">{filteredLogs.length} logs</Badge>
                </div>

                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-4 space-y-2">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
                      >
                        {getLogLevelIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {log.level.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {log.source}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium break-words">{log.message}</p>
                          {log.data && (
                            <pre className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="metrics" className="flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <Select value={selectedMetricType} onValueChange={setSelectedMetricType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Metrics</SelectItem>
                      <SelectItem value="timer">Timers</SelectItem>
                      <SelectItem value="api">API Calls</SelectItem>
                      <SelectItem value="component">Components</SelectItem>
                      <SelectItem value="user_action">User Actions</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="secondary">{filteredMetrics.length} metrics</Badge>
                </div>

                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-4 space-y-2">
                    {filteredMetrics.map((metric, index) => (
                      <div
                        key={`${metric.name}_${metric.timestamp}_${index}`}
                        className="flex items-center justify-between p-3 rounded-lg border bg-background/50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{metric.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(metric.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">
                            {metric.name.includes('timer') 
                              ? `${metric.value.toFixed(2)}ms`
                              : metric.value.toLocaleString()
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="performance" className="flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Avg Component Load
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {getAverageMetric('component_load').toFixed(2)}ms
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Avg API Call
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {getAverageMetric('api_call').toFixed(2)}ms
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        User Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metrics.filter(m => m.name.includes('user_action')).length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Performance metrics are collected automatically when debug mode is enabled. 
                    Use these insights to identify bottlenecks and optimize your application.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};